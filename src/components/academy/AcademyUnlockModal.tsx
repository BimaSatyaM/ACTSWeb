'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

interface AcademyUnlockModalProps {
  mode?: 'inline' | 'modal'
  trackTitle?: string
  onClose?: () => void
}

// Academy Access Gate Component
// Flat data-terminal panel for member-gated tracks (Tracks 2–4).
export function AcademyUnlockModal({
  mode = 'inline',
  trackTitle = 'Advanced Curriculum Track',
  onClose,
}: AcademyUnlockModalProps) {
  const { user, profile, claimInviteToken, acceptRules } = useAuth()
  const [tokenInput, setTokenInput] = useState('')
  const [rulesChecked, setRulesChecked] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isApproved = profile?.approved === true
  const hasAcceptedRules = profile?.rulesAccepted === true

  const handleClaimToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenInput.trim()) return
    setErrorMsg(null)
    setSuccessMsg(null)
    setSubmitting(true)
    try {
      await claimInviteToken(tokenInput.trim())
      setSuccessMsg('Invite token verified. Member access activated.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid or expired invite token'
      setErrorMsg(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptRules = async () => {
    setErrorMsg(null)
    setSubmitting(true)
    try {
      await acceptRules()
      setSuccessMsg('Agreement accepted. Full Academy and Dashboard activated.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to accept rules'
      setErrorMsg(message)
    } finally {
      setSubmitting(false)
    }
  }

  const content = (
    <div className="rounded-lg border border-[#1a2030] bg-[#0a0f1a] p-5 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 border-b border-[#1a2030] pb-4">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            Member access required: {trackTitle}
          </h3>
          <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
            Foundations and Risk Management is open to all signed-in accounts. Technical Analysis, Macroeconomics, and Legends require an approved ACTS invite token.
          </p>
        </div>

        {mode === 'modal' && onClose && (
          <button
            onClick={onClose}
            type="button"
            className="rounded p-1.5 text-[#94a3b8] hover:bg-[#141b29] hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="rounded border border-[#e5566f]/40 bg-[#2c1a20] p-3 text-xs text-[#e5566f]">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded border border-[#3fc07a]/40 bg-[#172a1d] p-3 text-xs text-[#3fc07a]">
          {successMsg}
        </div>
      )}

      {!user ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[#94a3b8]">
            Sign in to your ACTS account to save lesson progress or enter an invite token.
          </p>
          <Link
            href="/login"
            className="inline-flex h-8 items-center justify-center rounded bg-white px-4 text-xs font-medium text-[#070b14] hover:bg-[#e2e8f0] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54]"
          >
            Sign in
          </Link>
        </div>
      ) : !isApproved ? (
        <div className="space-y-4">
          <form onSubmit={handleClaimToken} className="space-y-2">
            <label htmlFor="academy-token" className="block text-xs font-medium text-[#cbd5e1]">
              Invite token
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="academy-token"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter invite code"
                className="h-9 flex-1 rounded border border-[#262f45] bg-[#070b14] px-3 text-xs text-white placeholder:text-[#64748b] focus:border-[#ff2e54] focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting || !tokenInput.trim()}
                className="h-9 rounded bg-white px-4 text-xs font-medium text-[#070b14] transition-colors hover:bg-[#e2e8f0] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54]"
              >
                {submitting ? 'Verifying...' : 'Verify token'}
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-[#1a2030] text-xs">
            <span className="text-[#94a3b8]">Need an invite code for full member access?</span>
            <a
              href="https://t.me/Mahenssss"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-2 hover:text-[#cbd5e1]"
            >
              Request token on Telegram
            </a>
          </div>
        </div>
      ) : !hasAcceptedRules ? (
        <div className="space-y-4">
          <p className="text-xs text-[#cbd5e1] leading-relaxed">
            Your token is approved. Confirm the risk agreement below to activate all tracks.
          </p>

          <label className="flex items-start gap-2.5 text-xs text-[#94a3b8] cursor-pointer">
            <input
              type="checkbox"
              checked={rulesChecked}
              onChange={(e) => setRulesChecked(e.target.checked)}
              className="mt-0.5 rounded border-[#262f45] bg-[#070b14] text-[#ff2e54] focus:ring-[#ff2e54]"
            />
            <span>
              I understand that derivative trading involves risk of capital loss and agree to follow position sizing and risk rules.
            </span>
          </label>

          <button
            onClick={handleAcceptRules}
            disabled={submitting || !rulesChecked}
            type="button"
            className="h-9 rounded bg-white px-4 text-xs font-medium text-[#070b14] transition-colors hover:bg-[#e2e8f0] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff2e54]"
          >
            {submitting ? 'Saving...' : 'Accept agreement'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-[#3fc07a]">
          Member access is active. Reload this view to open the lesson.
        </p>
      )}

      <div className="pt-3 border-t border-[#1a2030] flex items-center justify-between text-xs">
        <span className="text-[#94a3b8]">Foundations and Risk Management is open without a token.</span>
        <Link
          href="/dashboard/academy/foundations"
          className="text-white hover:underline underline-offset-2"
        >
          Open Foundations track
        </Link>
      </div>
    </div>
  )

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
        <div className="w-full max-w-xl">{content}</div>
      </div>
    )
  }

  return content
}
