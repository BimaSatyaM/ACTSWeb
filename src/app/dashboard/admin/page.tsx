'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface InviteToken {
  id: string
  used: boolean
  usedBy?: string | null
  usedByEmail?: string | null
  usedAt?: any
  createdAt?: any
}

export default function AdminPanel() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tokens, setTokens] = useState<InviteToken[]>([])
  const [loadingTokens, setLoadingTokens] = useState(true)
  const [generating, setGenerating] = useState(false)
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
      const tokenList: InviteToken[] = []
      snapshot.forEach((doc) => {
        tokenList.push({
          id: doc.id,
          ...doc.data()
        } as InviteToken)
      })
      setTokens(tokenList)
      setLoadingTokens(false)
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
      const newToken = generateRandomToken()
      const tokenDocRef = doc(db, 'invite_tokens', newToken)
      await setDoc(tokenDocRef, {
        used: false,
        usedBy: null,
        usedByEmail: null,
        usedAt: null,
        createdAt: serverTimestamp()
      })
      setSuccessMsg(`Token generated successfully: ${newToken}`)
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
          tokenUsed: null
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-accent-theme border-t-transparent rounded-full animate-spin" />
      </div>
    )
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
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Used By</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/10">
                    {filteredTokens.map((t) => (
                      <tr key={t.id} className="hover:bg-[#f3ead2]/50 transition-colors duration-150">
                        <td className="py-3 font-mono tabular-nums font-bold text-slate-900 selection:bg-sky-200">{t.id}</td>
                        <td className="py-3">
                          <Badge variant={t.used ? 'NOT_HIT' : 'SIGNAL'}>
                            {t.used ? 'USED' : 'UNUSED'}
                          </Badge>
                        </td>
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
                    ))}
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
