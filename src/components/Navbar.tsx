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
    <header className="sticky top-0 z-50 w-full h-14 glass-navbar border-b border-white/[0.08] flex items-center">
      <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 flex items-center justify-between">
        {/* ─── LEFT: Brand Logo & Main Navigation ─── */}
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className="flex items-center group transition-all duration-200"
          >
            <span className="text-lg font-black tracking-wider bg-gradient-to-r from-white via-accent-theme to-white bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(255,46,84,0.25)]">
              ACTS
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path))
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'text-white bg-white/[0.08] border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                      : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* ─── RIGHT: Notification, Status Telemetry & User Controls ─── */}
        <div className="hidden md:flex items-center gap-3.5">
          {/* Notification Updates from Git Commits */}
          <div className="flex items-center justify-center">
            <NotificationPopover />
          </div>

          <div className="flex items-center justify-center">
            <StatusPill isOnline={isOnline} isLoading={isLoading} label={statusText} />
          </div>

          <span className="text-[11px] font-mono text-zinc-400 select-none leading-none flex items-center">
            {localTime}
          </span>

          {user ? (
            <div className="flex items-center">
              <Link 
                href="/dashboard/account" 
                className="flex items-center gap-2 px-1 py-1 rounded-md hover:bg-white/[0.04] transition-colors duration-150 cursor-pointer" 
                title="Account Settings"
              >
                <UserAvatar
                  src={user.photoURL}
                  name={profile?.displayName || user.displayName}
                  size="sm"
                />
                <span className="text-xs font-semibold text-white leading-none">
                  {profile?.displayName || user.displayName || 'Trader'}
                </span>
              </Link>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="primary" className="px-3.5 py-1.5 text-xs font-semibold">
                Log In
              </Button>
            </Link>
          )}
        </div>

        {/* ─── MOBILE: Hamburger Button ─── */}
        <div className="flex md:hidden items-center gap-2">
          <NotificationPopover />
          <StatusPill isOnline={isOnline} isLoading={isLoading} label={statusText} className="scale-90" />
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white transition-all cursor-pointer flex items-center justify-center"
            aria-label={isOpen ? "Close Menu" : "Open Menu"}
          >
            {isOpen ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ─── MOBILE Drawer via React Portal to document.body ─── */}
      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[99999] md:hidden">
          {/* Dark Translucent Backdrop (Click outside to close) */}
          <div 
            className="fixed inset-0 bg-black/40 transition-opacity duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Frosted Glass Slide-over Drawer */}
          <div 
            style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
            className="fixed inset-y-0 right-0 w-80 max-w-[82vw] bg-[rgba(11,15,26,0.65)] border-l border-white/[0.12] p-6 flex flex-col justify-between shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10 animate-in slide-in-from-right duration-200 overflow-y-auto"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <span className="text-sm font-bold text-white tracking-tight">Navigation</span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1.5 rounded-lg text-text-secondary hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  aria-label="Close Menu"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Close</span>
                </button>
              </div>

              {/* Main Links */}
              <nav className="flex flex-col gap-1.5">
                {navLinks.map((link) => {
                  const isActive = pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path))
                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`text-sm font-semibold py-2.5 px-3.5 rounded-lg transition-all ${
                        isActive
                          ? 'text-white bg-white/[0.08] border border-white/[0.08]'
                          : 'text-text-secondary hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      {link.name}
                    </Link>
                  )
                })}
              </nav>

              {/* Dashboard Sub-links if user is on dashboard */}
              {pathname.startsWith('/dashboard') && (
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block px-1">
                    Dashboard Views
                  </span>
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-medium py-2 px-3 rounded-lg text-text-secondary hover:text-white hover:bg-white/[0.04]"
                    >
                      Overview
                    </Link>
                    <Link
                      href="/dashboard/signals"
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-medium py-2 px-3 rounded-lg text-text-secondary hover:text-white hover:bg-white/[0.04]"
                    >
                      Live Signals
                    </Link>
                    <Link
                      href="/dashboard/news"
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-medium py-2 px-3 rounded-lg text-text-secondary hover:text-white hover:bg-white/[0.04]"
                    >
                      News
                    </Link>
                    <Link
                      href="/dashboard/calendar"
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-medium py-2 px-3 rounded-lg text-text-secondary hover:text-white hover:bg-white/[0.04]"
                    >
                      Performance Calendar
                    </Link>
                    <Link
                      href="/dashboard/academy"
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-medium py-2 px-3 rounded-lg text-text-secondary hover:text-white hover:bg-white/[0.04] flex items-center justify-between"
                    >
                      <span>ACTS Academy</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        Free Tier
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom User Area */}
            <div className="border-t border-white/[0.08] pt-6 space-y-4">
              {user ? (
                <div className="space-y-3">
                  <Link 
                    href="/dashboard/account" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                  >
                    <UserAvatar
                      src={user.photoURL}
                      name={profile?.displayName || user.displayName}
                      size="md"
                    />
                    <span className="text-xs font-bold text-white">
                      {profile?.displayName || user.displayName || 'Trader'}
                    </span>
                  </Link>
                  <Button 
                    variant="secondary" 
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="w-full text-xs py-2 text-accent-red border-accent-red/20 hover:bg-accent-red/10"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" className="w-full justify-center text-xs py-2">
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
