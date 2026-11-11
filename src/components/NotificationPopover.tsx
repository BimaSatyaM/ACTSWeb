'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface NotificationItem {
  id: string
  category: 'news' | 'system'
  tag: string
  title: string
  message: string
  timestamp: string
  link: string
  badgeColor: 'emerald' | 'rose' | 'amber' | 'indigo' | 'blue' | 'accent' | 'purple' | 'cyan' | 'zinc'
}

export function NotificationPopover() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'news' | 'system'>('all')
  const [hasUnread, setHasUnread] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setIsRefreshing(true)

      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        const list: NotificationItem[] = json.notifications || []
        setItems(list)

        if (list.length > 0) {
          const lastSeenTime = localStorage.getItem('acts_last_seen_notification_time')
          if (!lastSeenTime || new Date(list[0].timestamp).getTime() > new Date(lastSeenTime).getTime()) {
            setHasUnread(true)
          }
        }
      }
    } catch (err) {
      console.warn('[NOTIFICATIONS] Fetch notice:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Poll every 10 seconds for real-time market momentum & signal news alerts
    const interval = setInterval(() => {
      fetchNotifications(true)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleOpen = () => {
    if (!isOpen) {
      // Sync immediately on open so the latest 1m price move & signals show with zero delay
      fetchNotifications(true)
      if (items.length > 0) {
        localStorage.setItem('acts_last_seen_notification_time', new Date().toISOString())
        setHasUnread(false)
      }
    }
    setIsOpen(!isOpen)
  }

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    localStorage.setItem('acts_last_seen_notification_time', new Date().toISOString())
    setHasUnread(false)
  }

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date()
      const d = new Date(dateStr)
      const diffSecs = Math.floor((now.getTime() - d.getTime()) / 1000)

      if (isNaN(diffSecs) || diffSecs < 60) return 'Just now'
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const getTagColor = (color: NotificationItem['badgeColor']) => {
    switch (color) {
      case 'emerald':
        return 'text-emerald-400'
      case 'rose':
        return 'text-rose-400'
      case 'amber':
        return 'text-amber-400'
      case 'indigo':
        return 'text-indigo-400'
      case 'blue':
        return 'text-sky-400'
      case 'purple':
        return 'text-[#c084fc]'
      case 'zinc':
        return 'text-zinc-400'
      case 'cyan':
        return 'text-cyan-400'
      case 'accent':
      default:
        return 'text-[#ff3b69]'
    }
  }

  const getDotBgColor = (color: NotificationItem['badgeColor']) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
      case 'rose':
        return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
      case 'amber':
        return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
      case 'indigo':
        return 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]'
      case 'blue':
        return 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
      case 'purple':
        return 'bg-[#c084fc] shadow-[0_0_8px_rgba(192,132,252,0.85)]'
      case 'zinc':
        return 'bg-zinc-400 shadow-[0_0_6px_rgba(255,255,255,0.4)]'
      case 'cyan':
        return 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
      case 'accent':
      default:
        return 'bg-[#ff3b69] shadow-[0_0_8px_rgba(255,59,105,0.85)]'
    }
  }

  const renderTagIcon = (tag: string) => {
    switch (tag) {
      case 'LIVE SIGNAL':
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2" />
            <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
          </svg>
        )
      case 'INCOMING SIGNAL':
      case 'SIGNAL IMMINENT':
        return (
          <svg className="w-3 h-3 shrink-0 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
            <circle cx="12" cy="12" r="2" />
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
            <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
          </svg>
        )
      case 'WATCHLIST SETUP':
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )
      case 'AUTO-TRADE FILL':
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        )
      case 'TARGET HIT':
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        )
      case 'STOP LOSS HIT':
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )
      case 'BULLISH MOMENTUM':
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        )
      case 'BEARISH PRESSURE':
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            <polyline points="17 18 23 18 23 12" />
          </svg>
        )
      case 'PRICE MILESTONE':
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        )
      case 'MACRO AI WIRE':
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="14" x2="23" y2="14" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="14" x2="4" y2="14" />
          </svg>
        )
      case 'MARKET WIRE':
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8V6Z" />
          </svg>
        )
      case 'SYSTEM UPDATE':
      default:
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        )
    }
  }

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true
    return item.category === activeTab
  })

  const newsCount = items.filter((i) => i.category === 'news').length
  const systemCount = items.filter((i) => i.category === 'system').length

  const handleItemClick = (item: NotificationItem) => {
    setIsOpen(false)
    if (item.link.startsWith('http')) {
      window.open(item.link, '_blank', 'noopener,noreferrer')
    } else {
      router.push(item.link)
    }
  }

  const latestItem = items[0]

  return (
    <div className="relative flex items-center gap-2" ref={popoverRef}>
      {latestItem && (
        <div
          onClick={toggleOpen}
          className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/[0.04] transition-all duration-150 cursor-pointer group max-w-[200px] md:max-w-[320px] lg:max-w-[440px] select-none"
          title={`Click to view notifications • Latest: ${latestItem.title}`}
        >
          <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
            {latestItem.tag.includes('SIGNAL') && (
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${getDotBgColor(latestItem.badgeColor)}`} />
            )}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${getDotBgColor(latestItem.badgeColor)}`} />
          </span>

          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 hidden md:inline ${getTagColor(latestItem.badgeColor)}`}>
            {latestItem.tag}
          </span>

          <span className="text-zinc-600 text-[10px] shrink-0 hidden md:inline">•</span>

          <span className="text-[11px] font-mono font-medium text-zinc-300 group-hover:text-white transition-colors truncate">
            {latestItem.title}
          </span>

          <span className="text-[10px] font-mono text-zinc-500 shrink-0 hidden lg:inline">
            {formatRelativeTime(latestItem.timestamp)}
          </span>
        </div>
      )}

      <button
        onClick={toggleOpen}
        className="relative p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/[0.04] transition-all duration-150 cursor-pointer flex items-center justify-center shrink-0"
        aria-label="Notifications"
        title="Notifications: News, Signals & Updates"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {hasUnread && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00e676] ring-2 ring-[#070b14] animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-[410px] max-w-[410px] max-h-[calc(100vh-4.5rem)] rounded-xl bg-[#080d1a]/95 border border-white/[0.12] shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-3xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3.5 pb-2.5 border-b border-white/[0.07] bg-white/[0.02] shrink-0">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight uppercase font-mono">
                  Notifications
                </span>
                {items.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-white/[0.06] text-zinc-300">
                    {items.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchNotifications(true)}
                  disabled={isRefreshing}
                  className="text-[10px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  title="Refresh notifications"
                >
                  <svg className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Sync</span>
                </button>

                {hasUnread && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-black/40 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`py-1.5 px-2 text-center rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-white/10 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>All ({items.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('news')}
                className={`py-1.5 px-2 text-center rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'news'
                    ? 'bg-white/10 text-emerald-400 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>News</span>
                {newsCount > 0 && <span className="text-[10px] opacity-80 font-bold">({newsCount})</span>}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('system')}
                className={`py-1.5 px-2 text-center rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'system'
                    ? 'bg-white/10 text-[#ff3b69] font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <svg className="w-3.5 h-3.5 text-[#ff3b69]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>System</span>
                {systemCount > 0 && <span className="text-[10px] opacity-80 font-bold">({systemCount})</span>}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px] custom-scrollbar divide-y divide-white/[0.05] p-1">
            {loading ? (
              <div className="p-8 text-center text-xs font-mono text-zinc-400 flex flex-col items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin text-accent-theme" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                </svg>
                <span>Syncing live notifications...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-zinc-400 space-y-1">
                <p className="text-zinc-300 font-medium">No notifications in this view.</p>
                <p className="text-[11px] text-zinc-500">Live signals and updates appear automatically here.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="p-3 hover:bg-white/[0.04] transition-all duration-150 rounded-lg space-y-1.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider ${getTagColor(
                        item.badgeColor
                      )}`}
                    >
                      {renderTagIcon(item.tag)}
                      <span>{item.tag}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-white leading-snug font-semibold group-hover:text-emerald-300 transition-colors flex items-center justify-between gap-2">
                    <span>{item.title}</span>
                    <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </p>

                  <p className="text-[11px] text-zinc-400 leading-relaxed font-mono line-clamp-2">
                    {item.message}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 px-3.5 bg-black/40 border-t border-white/[0.07] flex items-center justify-between text-[11px] font-mono text-zinc-400 shrink-0">
            <Link
              href="/dashboard/signals"
              onClick={() => setIsOpen(false)}
              className="hover:text-white transition-colors flex items-center gap-1.5 text-[11px]"
            >
              <span>Live Signals</span>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>

            <Link
              href="/dashboard/live-news"
              onClick={() => setIsOpen(false)}
              className="hover:text-white transition-colors flex items-center gap-1.5 text-[11px]"
            >
              <span>Macro News Wire</span>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
