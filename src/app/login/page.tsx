'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { ActsLogo } from '@/components/ui/ActsLogo'

export default function Login() {
  const { user, loginWithGoogle, loading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If user is logged in, push to dashboard
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleGoogleSignIn = async () => {
    setError(null)
    try {
      await loginWithGoogle()
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <GlassCard className="w-full max-w-md space-y-8 text-center bg-[#faf2df] border-slate-900/10">
        <div className="space-y-3">
          <div className="flex justify-center pb-1">
            <ActsLogo size="lg" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#0369a1] font-bold block">
            ACTS Authentication Gateway
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Sign in to ACTS
          </h1>
          <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            Authenticate with your Google account to access the multi-regime confluence command deck.
          </p>
        </div>

        {error && (
          <div className="border-l-2 border-rose-600 pl-3 py-1 text-rose-700 text-xs text-left leading-relaxed">
            <b>Authentication Error:</b> {error}
          </div>
        )}

        <div className="pt-2">
          <Button
            variant="primary"
            className="mx-auto px-6 py-3 text-sm flex items-center justify-center gap-3 font-semibold"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.513 0-6.36-2.847-6.36-6.36s2.847-6.36 6.36-6.36c1.63 0 3.117.618 4.258 1.63L21.24 4.4A11.96 11.96 0 0012.24 0C5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.8 0 12.24-5.44 12.24-12.24 0-.78-.075-1.53-.21-2.255H12.24z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </Button>
        </div>

        <div className="border-t border-slate-900/10 pt-5 text-[11px] font-mono text-slate-500 leading-relaxed">
          Authorized domains and connections are restricted by OAuth consent policies.<br />
          ACTS v2.4 · Google Authentication Service
        </div>
      </GlassCard>
    </main>
  )
}
