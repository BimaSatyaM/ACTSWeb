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
// Daylight 2.1 data-terminal panel for member-gated tracks (Tracks 2-4).
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
    <div className="rounded-xl border border-slate-900/10 bg-[#faf2df] p-5 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 border-b border-slate-900/10 pb-4">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Member access required: {trackTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Foundations and Risk Management is open to all signed-in accounts. Technical Analysis, Macroeconomics, and Legends require an approved ACTS invite token.
          </p>
        </div>

        {mode === 'modal' && onClose && (
          <button
            onClick={onClose}
            type="button"
            className="rounded p-1.5 text-slate-500 hover:bg-[#f3ead2] hover:text-slate-800 transition-colors cursor-pointer"
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
        <div className="border-l-2 border-rose-600 pl-3 py-1 text-xs text-rose-700 font-medium">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="border-l-2 border-emerald-600 pl-3 py-1 text-xs text-emerald-800 font-medium">
          {successMsg}
        </div>
      )}

      {!user ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            Sign in to your ACTS account to save lesson progress or enter an invite token.
          </p>
          <Link
            href="/login"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-[#0369a1] px-4 text-xs font-semibold text-white hover:bg-[#0284c7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7]"
          >
            Sign in
          </Link>
        </div>
      ) : !isApproved ? (
        <div className="space-y-4">
          <form onSubmit={handleClaimToken} className="space-y-2">
            <label htmlFor="academy-token" className="block text-xs font-semibold text-slate-700">
              Invite token
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="academy-token"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter invite code"
                className="h-9 flex-1 rounded-lg border border-slate-900/15 bg-[#fdfaf3] px-3 text-xs text-slate-900 placeholder:text-slate-500 focus:border-[#0369a1] focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting || !tokenInput.trim()}
                className="h-9 rounded-lg bg-[#0369a1] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#0284c7] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] cursor-pointer"
              >
                {submitting ? 'Verifying...' : 'Verify token'}
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-slate-900/10 text-xs">
            <span className="text-slate-500">Need an invite code for full member access?</span>
            <a
              href="https://t.me/Mahenssss"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0369a1] underline underline-offset-2 hover:text-[#0284c7] font-semibold"
            >
              Request token on Telegram
            </a>
          </div>
        </div>
      ) : !hasAcceptedRules ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Your token is approved. Confirm the risk agreement below to activate all tracks.
          </p>

          <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={rulesChecked}
              onChange={(e) => setRulesChecked(e.target.checked)}
              className="mt-0.5 rounded border-slate-900/15 text-[#0369a1] focus:ring-[#0369a1]"
            />
            <span>
              I understand that derivative trading involves risk of capital loss and agree to follow position sizing and risk rules.
            </span>
          </label>

          <button
            onClick={handleAcceptRules}
            disabled={submitting || !rulesChecked}
            type="button"
            className="h-9 rounded-lg bg-[#0369a1] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#0284c7] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Accept agreement'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-emerald-700 font-semibold">
          Member access is active. Reload this view to open the lesson.
        </p>
      )}

      <div className="pt-3 border-t border-slate-900/10 flex items-center justify-between text-xs">
        <span className="text-slate-500">Foundations and Risk Management is open without a token.</span>
        <Link
          href="/dashboard/academy/foundations"
          className="text-[#0369a1] hover:underline underline-offset-2 font-semibold"
        >
          Open Foundations track
        </Link>
      </div>
    </div>
  )

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
        <div className="w-full max-w-xl">{content}</div>
      </div>
    )
  }

  return content
}
