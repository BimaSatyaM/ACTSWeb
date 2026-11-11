'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'

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
    <main className="min-h-screen flex items-center justify-center px-6 py-12 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[30%] w-[350px] h-[350px] rounded-full bg-accent-theme/5 blur-[100px]" />
      </div>

      <GlassCard className="w-full max-w-md space-y-8 relative z-10 text-center hover:border-white/10 transition-all duration-300">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xl bg-gradient-to-r from-rose-500/15 via-red-500/10 to-transparent border border-white/[0.08] text-rose-300 text-[10px] uppercase font-bold tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]" />
            <span>Secure Auth Gateway</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome to ACTS
          </h1>
          <p className="text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
            Please authenticate using your Google account to access the AI confluence trading panel.
          </p>
        </div>

        {error && (
          <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs rounded-xl p-4 text-left leading-relaxed">
            <b>Authentication Error:</b> {error}
          </div>
        )}

        <div className="space-y-4 pt-4">
          <Button 
            variant="primary" 
            className="mx-auto px-6 py-3 text-sm flex items-center justify-center gap-3 font-semibold hover:scale-[1.01]"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.513 0-6.36-2.847-6.36-6.36s2.847-6.36 6.36-6.36c1.63 0 3.117.618 4.258 1.63L21.24 4.4A11.96 11.96 0 0012.24 0C5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.8 0 12.24-5.44 12.24-12.24 0-.78-.075-1.53-.21-2.255H12.24z"/>
                </svg>
                Continue with Google
              </>
            )}
          </Button>
        </div>

        <div className="border-t border-white/[0.04] pt-6 text-[10px] text-text-muted leading-relaxed">
          Authorized domains and connections are restricted by OAuth consent policies.<br />
          ACTS V3 · Google Authentication Service
        </div>
      </GlassCard>
    </main>
  )
}
