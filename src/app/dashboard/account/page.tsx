'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, toMillis } from '@/context/AuthContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { DashboardWorkspaceSkeleton } from '@/components/ui/Skeleton'

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
    return <DashboardWorkspaceSkeleton />
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
      <div className="space-y-1 border-b border-slate-900/10 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Account Configuration</h1>
        <p className="text-xs text-slate-600">Manage your public profile identity and audit your activation parameters.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <GlassCard className="text-center space-y-4 bg-[#faf2df] border-slate-900/10">
            <div className="flex justify-center">
              <UserAvatar
                src={user.photoURL}
                name={profile?.displayName || user.displayName}
                size="xl"
              />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {profile?.displayName || user.displayName || 'Trader'}
              </h3>
              <p className="text-[11px] font-mono text-slate-500 select-all leading-normal truncate px-2">
                {user.email}
              </p>
            </div>

            <div className="h-[1px] bg-slate-900/10" />

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Account Standing</span>
              <Badge variant={badgeVariant} className="text-[11px] font-bold uppercase tracking-wider">
                {statusLabel}
              </Badge>
            </div>

            {profile?.tokenUsed && (
              <div className="pt-2 text-left border-t border-slate-900/10 space-y-1.5">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Claimed Key</span>
                <span className="text-xs font-mono font-bold text-[#0369a1] select-all block truncate">
                  {profile.tokenUsed}
                </span>
                {(profile.subscriptionPlan || profile.subscriptionExpiresAt) && (
                  <div className="text-[11px] font-mono text-slate-600 pt-0.5">
                    {profile.subscriptionPlan && <span>Plan: <strong className="text-slate-900">{profile.subscriptionPlan}</strong></span>}
                    {toMillis(profile.subscriptionExpiresAt) && (
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        Expires {new Date(toMillis(profile.subscriptionExpiresAt)!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-slate-900/10">
              <button
                type="button"
                onClick={logout}
                className="w-full justify-center text-xs font-semibold py-2 text-rose-700 hover:text-rose-900 hover:underline cursor-pointer flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </GlassCard>
        </div>

        <div className="md:col-span-2">
          <GlassCard className="space-y-6 bg-[#faf2df] border-slate-900/10">
            <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-700 border-b border-slate-900/10 pb-3.5">
              Edit Details
            </h3>

            {errorMsg && <p className="text-xs text-rose-700 border-l-2 border-rose-600 pl-3 py-1">{errorMsg}</p>}
            {successMsg && <p className="text-xs text-emerald-700 border-l-2 border-emerald-600 pl-3 py-1">{successMsg}</p>}

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="account-display-name" className="text-[10px] font-mono uppercase font-bold text-slate-600 block">Display Name</label>
                <input
                  id="account-display-name"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your display name"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#fdfaf3] border border-slate-900/15 text-slate-900 text-sm focus:outline-none focus:border-[#0284c7]"
                  required
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  This is your public name displayed inside the live dashboard and account panels.
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
