'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { UserAvatar } from '@/components/ui/UserAvatar'

export default function AccountPage() {
  const { user, profile, loading: authLoading, updateDisplayName, logout } = useAuth()
  const router = useRouter()
  const [nameInput, setNameInput] = useState('')
  const [prevProfileName, setPrevProfileName] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const currentProfileName = profile?.displayName || user?.displayName || ''
  if (currentProfileName && currentProfileName !== prevProfileName) {
    setPrevProfileName(currentProfileName)
    setNameInput(currentProfileName)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim()) return
    setErrorMsg(null)
    setSuccessMsg(null)
    setSaving(true)
    try {
      await updateDisplayName(nameInput.trim())
      setSuccessMsg('Profile updated successfully!')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update name')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setNameInput(user?.displayName || '')
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-accent-theme border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Determine user level status label
  let statusLabel = 'Newbie'
  let badgeVariant: 'SIGNAL' | 'WATCHLIST' | 'NEUTRAL' = 'NEUTRAL'

  if (profile?.role === 'admin') {
    statusLabel = 'Admin'
    badgeVariant = 'SIGNAL'
  } else if (profile?.approved) {
    statusLabel = 'Trader'
    badgeVariant = 'WATCHLIST'
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-1 border-b border-white/[0.06] pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Account Configuration</h1>
        <p className="text-xs text-text-secondary">Manage your public profile identity and audit your activation parameters.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Card: Profile Status Card */}
        <div className="md:col-span-1 space-y-6">
          <GlassCard className="text-center space-y-4 hover:border-white/10 transition-all duration-300">
            <div className="flex justify-center">
              <UserAvatar
                src={user.photoURL}
                name={profile?.displayName || user.displayName}
                size="xl"
              />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white leading-snug">
                {profile?.displayName || user.displayName || 'Trader'}
              </h3>
              <p className="text-[10px] text-text-muted select-all leading-normal truncate px-2">
                {user.email}
              </p>
            </div>

            <div className="h-[1px] bg-white/[0.04]" />

            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-bold text-text-muted block">Account Standing</span>
              <Badge 
                variant={badgeVariant} 
                className="text-[10px] font-black uppercase tracking-wider py-1 px-3"
              >
                {statusLabel}
              </Badge>
            </div>

            {profile?.tokenUsed && (
              <div className="pt-2 text-left">
                <span className="text-[9px] uppercase font-bold text-text-muted block">Claimed Key</span>
                <span className="text-[10px] font-mono text-white/50 select-all block mt-0.5 truncate bg-white/[0.01] p-1.5 rounded border border-white/[0.03]">
                  {profile.tokenUsed}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-white/[0.04]">
              <Button
                variant="secondary"
                type="button"
                onClick={logout}
                className="w-full justify-center text-xs py-2.5 text-rose-400 border-rose-500/20 hover:bg-rose-500/10 hover:border-rose-500/40 cursor-pointer flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign Out
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Right Card: Profile Edit Form */}
        <div className="md:col-span-2">
          <GlassCard className="space-y-6">
            <h3 className="text-sm uppercase font-black tracking-widest text-text-muted border-b border-white/[0.04] pb-4">
              Edit Details
            </h3>

            {errorMsg && <p className="text-xs text-accent-red bg-accent-red/10 p-3 rounded-lg border border-accent-red/20">{errorMsg}</p>}
            {successMsg && <p className="text-xs text-accent-green bg-accent-green/10 p-3 rounded-lg border border-accent-green/20">{successMsg}</p>}

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-text-muted block">Display Name</label>
                <input 
                  type="text" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Satoshi"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-accent-theme/50"
                  required
                />
                <p className="text-[10px] text-text-muted leading-relaxed">
                  This is your public name displayed inside the live dashboard and chat panels.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="secondary" 
                  type="button" 
                  onClick={handleReset}
                  className="px-5 py-2 font-semibold cursor-pointer"
                >
                  Reset changes
                </Button>
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="px-5 py-2 font-semibold cursor-pointer"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>

      </div>
    </div>
  )
}
