'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'

export function DashboardGating() {
  const { 
    user, 
    profile, 
    updateDisplayName, 
    claimInviteToken, 
    acceptRules 
  } = useAuth()

  const [tokenInput, setTokenInput] = useState('')
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [rulesChecked, setRulesChecked] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isApproved = profile?.approved === true

  const handleSetName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayNameInput.trim()) return
    setErrorMsg(null)
    setSubmitting(true)
    try {
      await updateDisplayName(displayNameInput.trim())
      setSuccessMsg('Display name set successfully!')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update name')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClaimToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenInput.trim()) return
    setErrorMsg(null)
    setSuccessMsg(null)
    setSubmitting(true)
    try {
      await claimInviteToken(tokenInput.trim())
      setSuccessMsg('Account activated! Welcome Trader.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptRules = async () => {
    setErrorMsg(null)
    setSubmitting(true)
    try {
      await acceptRules()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept rules')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-8 min-h-[70vh]">
      <GlassCard className="w-full max-w-lg p-6 sm:p-8 text-center space-y-6">
        {!user ? (
          // 1. Visitor state: Not logged in
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-rose-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Gated Dashboard</span>
            </div>
            <h2 className="text-xl font-bold text-white">Access Locked</h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Live signal feeds, market telemetry, and custom validation calendars are only available to authorized traders.
            </p>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-4 text-xs text-text-muted leading-relaxed">
              Log in first to view the contact channel and submit your access request.
            </div>
            <Link href="/login" className="inline-block pt-2">
              <Button 
                variant="primary" 
                className="px-5 py-2.5 flex items-center justify-center gap-2 font-semibold text-xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.513 0-6.36-2.847-6.36-6.36s2.847-6.36 6.36-6.36c1.63 0 3.117.618 4.258 1.63L21.24 4.4A11.96 11.96 0 0012.24 0C5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.8 0 12.24-5.44 12.24-12.24 0-.78-.075-1.53-.21-2.255H12.24z"/>
                </svg>
                Continue to Log In
              </Button>
            </Link>
          </div>
        ) : !profile?.displayName ? (
          // 2. Initial login: Set display name
          <form onSubmit={handleSetName} className="space-y-4 text-left">
            <h2 className="text-xl font-bold text-white text-center">Set Display Name</h2>
            <p className="text-xs text-text-secondary leading-relaxed text-center">
              Please set your trader name before proceeding.
            </p>
            
            {errorMsg && <p className="text-xs text-accent-red bg-accent-red/10 p-3 rounded-lg border border-accent-red/20">{errorMsg}</p>}
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-muted">Trader Name</label>
              <input 
                type="text" 
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="e.g. Satoshi"
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-accent-theme/50"
                required
              />
            </div>
            <div className="flex justify-center pt-2">
              <Button 
                variant="primary" 
                type="submit" 
                className="px-6 py-2 text-xs font-semibold"
                disabled={submitting}
              >
                {submitting ? 'Setting Name...' : 'Save and Continue'}
              </Button>
            </div>
          </form>
        ) : !isApproved ? (
          // 3. Authenticated: Token activation / Telegram contact
          <div className="space-y-5 text-left">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 text-rose-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Activation Required</span>
              </div>
              <h2 className="text-xl font-bold text-white">Pending Activation</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                To activate your dashboard, request an invitation token from the system administrator on Telegram.
              </p>
            </div>

            {errorMsg && <p className="text-xs text-accent-red bg-accent-red/10 p-3 rounded-lg border border-accent-red/20">{errorMsg}</p>}
            {successMsg && <p className="text-xs text-accent-green bg-accent-green/10 p-3 rounded-lg border border-accent-green/20">{successMsg}</p>}

            <div className="space-y-4 text-center">
              <a 
                href="https://t.me/Mahenssss" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 mx-auto text-xs font-medium text-[#38bdf8] hover:text-white hover:underline transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.752-.169.706-.432.943-.685.966-.55.051-.968-.362-1.501-.711-.835-.546-1.307-.886-2.119-1.421-.938-.619-.33-.958.205-1.514.14-.145 2.573-2.358 2.62-2.56.006-.025.011-.122-.047-.174-.059-.051-.144-.034-.207-.02-.089.02-1.506.958-4.251 2.811-.402.277-.766.412-1.092.405-.361-.008-1.055-.204-1.571-.372-.633-.206-1.137-.315-1.093-.665.023-.182.273-.369.749-.561 2.932-1.277 4.888-2.12 5.867-2.529 2.793-1.166 3.375-1.368 3.753-1.375.083-.001.268.02.388.118.101.082.129.193.136.27.008.087.014.286-.002.433z"/>
                </svg>
                <span>Contact Admin on Telegram</span>
              </a>

              <form onSubmit={handleClaimToken} className="space-y-3 pt-2 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted">Enter Activation Token</label>
                  <input 
                    type="text" 
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="e.g. ACTS-XXXX-XXXX-XXXX"
                    className="w-full px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-accent-theme/50"
                    required
                  />
                </div>
                <div className="flex justify-center pt-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="px-6 py-2 text-xs font-semibold"
                    disabled={submitting}
                  >
                    {submitting ? 'Activating...' : 'Activate Dashboard'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          // 4. System Rules Agreement Panel
          <div className="space-y-5 text-left">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 text-rose-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Usage Guidelines</span>
              </div>
              <h2 className="text-xl font-bold text-white">System Security Agreement</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Please confirm your commitment to the system guidelines.
              </p>
            </div>

            <div className="space-y-2.5 bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg text-xs text-text-secondary leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="text-accent-theme font-bold">1.</span>
                <div>
                  <strong className="text-white block font-semibold">Private Activation Keys</strong>
                  Tokens are single-use and bound exclusively to your unique profile.
                </div>
              </div>
              
              <div className="flex items-start gap-2.5">
                <span className="text-accent-theme font-bold">2.</span>
                <div>
                  <strong className="text-white block font-semibold">Zero Signal Redistribution</strong>
                  Do not forward or distribute live confluence signals to external forums or channels.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-accent-theme font-bold">3.</span>
                <div>
                  <strong className="text-white block font-semibold">Research Telemetry</strong>
                  All model telemetry is for analysis and execution assistance. Trade responsibly.
                </div>
              </div>
            </div>

            {errorMsg && <p className="text-xs text-accent-red bg-accent-red/10 p-3 rounded-lg border border-accent-red/20">{errorMsg}</p>}

            <div className="flex items-start gap-3 bg-white/[0.02] border border-white/[0.05] p-3.5 rounded-lg">
              <input 
                type="checkbox" 
                id="accept-rules-check"
                checked={rulesChecked}
                onChange={(e) => setRulesChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 cursor-pointer accent-accent-theme rounded border-white/20 bg-white/[0.04]"
              />
              <label htmlFor="accept-rules-check" className="text-xs text-text-secondary select-none leading-relaxed cursor-pointer">
                I agree to the usage guidelines and security protocols of the ACTS dashboard.
              </label>
            </div>

            <div className="flex justify-center pt-2">
              <Button 
                variant="primary" 
                onClick={handleAcceptRules}
                disabled={!rulesChecked || submitting}
                className="px-6 py-2 text-xs font-semibold cursor-pointer"
              >
                {submitting ? 'Authenticating Access...' : 'Agree & Enter Dashboard'}
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
