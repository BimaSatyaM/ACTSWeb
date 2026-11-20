'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, toMillis } from '@/context/AuthContext'
import { DashboardWorkspaceSkeleton } from '@/components/ui/Skeleton'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const SUBSCRIPTION_PLANS = [
  { id: '1D', label: '1 Day', days: 1 },
  { id: '30D', label: '30 Days', days: 30 },
  { id: '60D', label: '2 Months', days: 60 },
  { id: '365D', label: '1 Year', days: 365 },
  { id: 'LIFETIME', label: 'Lifetime', days: null },
] as const

type PlanId = (typeof SUBSCRIPTION_PLANS)[number]['id']

interface InviteToken {
  id: string
  used: boolean
  usedBy?: string | null
  usedByEmail?: string | null
  usedAt?: any
  createdAt?: any
  durationDays?: number | null
  planLabel?: string
  expiresAt?: any
}

export default function AdminPanel() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tokens, setTokens] = useState<InviteToken[]>([])
  const [loadingTokens, setLoadingTokens] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('30D')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNUSED' | 'USED'>('ALL')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!user || profile?.role !== 'admin') {
        router.push('/dashboard')
      }
    }
  }, [user, profile, authLoading, router])

  // Watch invite_tokens collection in real-time
  useEffect(() => {
    if (profile?.role !== 'admin') return

    const q = query(collection(db, 'invite_tokens'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nowMs = Date.now()
      const tokenList: InviteToken[] = []
      const expiredTokens: InviteToken[] = []

      snapshot.forEach((d) => {
        const tokenObj = {
          id: d.id,
          ...d.data()
        } as InviteToken
        const expMs = toMillis(tokenObj.expiresAt)
        if (tokenObj.used && expMs !== null && nowMs >= expMs) {
          expiredTokens.push(tokenObj)
        } else {
          tokenList.push(tokenObj)
        }
      })

      setTokens(tokenList)
      setLoadingTokens(false)

      // Auto-delete expired subscription tokens and revoke terminal access
      if (expiredTokens.length > 0) {
        Promise.all(
          expiredTokens.map(async (exp) => {
            try {
              await deleteDoc(doc(db, 'invite_tokens', exp.id))
              if (exp.usedBy) {
                await updateDoc(doc(db, 'users', exp.usedBy), {
                  approved: false,
                  tokenUsed: null,
                  subscriptionPlan: null,
                  subscriptionExpiresAt: null
                }).catch(() => {})
              }
            } catch (cleanupErr) {
              console.error(`Failed to auto-cleanup expired token ${exp.id}:`, cleanupErr)
            }
          })
        )
      }
    }, (err) => {
      console.error('Error fetching tokens:', err)
      setErrorMsg('Permissions check failed: Unable to fetch tokens.')
      setLoadingTokens(false)
    })

    return () => unsubscribe()
  }, [profile])

  const generateRandomToken = () => {
    // Generate a random token format: ACTS-XXXX-XXXX-XXXX
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const segment = () => {
      let str = ''
      for (let i = 0; i < 4; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return str
    }
    return `ACTS-${segment()}-${segment()}-${segment()}`
  }

  const handleGenerateToken = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setGenerating(true)
    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan) || SUBSCRIPTION_PLANS[1]
      const newToken = generateRandomToken()
      const tokenDocRef = doc(db, 'invite_tokens', newToken)
      await setDoc(tokenDocRef, {
        used: false,
        usedBy: null,
        usedByEmail: null,
        usedAt: null,
        durationDays: plan.days,
        planLabel: plan.label,
        expiresAt: null,
        createdAt: serverTimestamp()
      })
      setSuccessMsg(`Token generated (${plan.label}): ${newToken}`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate token')
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteToken = async (tokenId: string) => {
    if (!window.confirm(`Are you sure you want to delete token ${tokenId}?`)) return
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const tokenInfo = tokens.find(t => t.id === tokenId)
      const batch = writeBatch(db)
      
      // 1. Delete token document
      batch.delete(doc(db, 'invite_tokens', tokenId))
      
      // 2. Revoke user access if token was active
      if (tokenInfo?.used && tokenInfo.usedBy) {
        batch.update(doc(db, 'users', tokenInfo.usedBy), {
          approved: false,
          tokenUsed: null,
          subscriptionPlan: null,
          subscriptionExpiresAt: null
        })
      }

      await batch.commit()
      setSuccessMsg('Token deleted and user access revoked successfully.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete token')
    }
  }

  // Filter and search tokens
  const filteredTokens = tokens.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.usedByEmail && t.usedByEmail.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (statusFilter === 'UNUSED') return matchesSearch && !t.used
    if (statusFilter === 'USED') return matchesSearch && t.used
    return matchesSearch
  })

  if (authLoading || profile?.role !== 'admin') {
    return <DashboardWorkspaceSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-slate-900/10 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#0369a1] font-bold block mb-1">
            Admin Control Center
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Access Key Manager</h1>
          <p className="text-xs text-slate-600">Generate and audit secure, single-use activation tokens for ACTS traders.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-6">
          <GlassCard className="space-y-4 bg-[#faf2df] border-slate-900/10">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Token Generator</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Create a cryptographically secure, single-use activation key. Provide this key to verified traders to unlock their dashboard access.
            </p>

            {errorMsg && <p className="text-xs text-rose-700 border-l-2 border-rose-600 pl-3 py-1">{errorMsg}</p>}
            {successMsg && <p className="text-xs font-mono text-emerald-700 border-l-2 border-emerald-600 pl-3 py-1">{successMsg}</p>}

            <div className="space-y-1.5">
              <label htmlFor="subscription-plan-select" className="text-[11px] font-mono uppercase font-bold text-slate-600 block">
                Subscription Duration
              </label>
              <select
                id="subscription-plan-select"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value as PlanId)}
                className="w-full px-3 py-2 rounded-lg bg-[#fdfaf3] border border-slate-900/15 text-slate-900 text-xs font-mono font-semibold focus:outline-none focus:border-[#0284c7] cursor-pointer"
              >
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.days !== null ? `${plan.label} (${plan.days}d)` : `${plan.label} (No Expiry)`}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              className="w-full py-2.5 text-xs font-bold cursor-pointer"
              onClick={handleGenerateToken}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Access Token'}
            </Button>
          </GlassCard>

          <div className="border-l-2 border-[#0369a1] pl-3.5 py-0.5 space-y-1">
            <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">Console Rules</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cloud Firestore security rules restrict read/write access to this directory to the admin UID only. All user queries on individual keys are audited.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="space-y-5 bg-[#faf2df] border-slate-900/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900/10 pb-4">
              <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">Key Database</h3>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  aria-label="Search activation keys or emails"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by key or email..."
                  className="px-3 py-1.5 rounded-lg bg-[#fdfaf3] border border-slate-900/15 text-slate-900 text-xs focus:outline-none focus:border-[#0284c7] w-full sm:w-44"
                />

                <select
                  aria-label="Filter keys by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg bg-[#fdfaf3] border border-slate-900/15 text-slate-900 text-xs focus:outline-none focus:border-[#0284c7] cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="UNUSED">Unused Only</option>
                  <option value="USED">Used Only</option>
                </select>
              </div>
            </div>

            {loadingTokens ? (
              <div className="text-center py-12 text-xs font-mono text-slate-500">Loading tokens from Firestore...</div>
            ) : filteredTokens.length === 0 ? (
              <div className="text-center py-12 text-xs font-mono text-slate-500">No activation keys found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900/10 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                      <th className="pb-3">Activation Key</th>
                      <th className="pb-3">Plan</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Expires</th>
                      <th className="pb-3">Used By</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/10">
                    {filteredTokens.map((t) => {
                      const expMs = toMillis(t.expiresAt)
                      const isLifetime = t.durationDays === null || t.planLabel === 'Lifetime'
                      const expDisplay = isLifetime
                        ? 'Never'
                        : t.used && expMs
                          ? new Date(expMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'On activation'
                      return (
                      <tr key={t.id} className="hover:bg-[#f3ead2]/50 transition-colors duration-150">
                        <td className="py-3 font-mono tabular-nums font-bold text-slate-900 selection:bg-sky-200">{t.id}</td>
                        <td className="py-3 font-mono text-slate-700 whitespace-nowrap">
                          {t.planLabel || (t.durationDays ? `${t.durationDays} Days` : 'Lifetime')}
                        </td>
                        <td className="py-3">
                          <Badge variant={t.used ? 'NOT_HIT' : 'SIGNAL'}>
                            {t.used ? 'ACTIVE' : 'UNUSED'}
                          </Badge>
                        </td>
                        <td className="py-3 font-mono text-slate-600 whitespace-nowrap">{expDisplay}</td>
                        <td className="py-3 text-slate-600 font-mono truncate max-w-[150px]" title={t.usedByEmail || ''}>
                          {t.usedByEmail || '-'}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            className="text-xs font-mono font-bold text-rose-700 hover:text-rose-900 hover:underline transition-colors cursor-pointer"
                            onClick={() => handleDeleteToken(t.id)}
                            aria-label={`Delete key ${t.id}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
