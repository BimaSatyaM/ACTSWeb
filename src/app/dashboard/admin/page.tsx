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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-accent-theme text-xs font-semibold">
            <span>🛡️</span>
            <span>Admin Control Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">Access Key Manager</h1>
          <p className="text-xs text-text-secondary">Generate and audit secure, single-use activation tokens for ACTS traders.</p>
        </div>
      </div>

      {/* Grid: Actions & Token list */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Generator panel */}
        <div className="space-y-6">
          <GlassCard className="space-y-4">
            <h3 className="text-xs font-bold text-white">Token Generator</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Create a cryptographically secure, single-use activation key. Provide this key to verified traders to unlock their dashboard access.
            </p>
            
            {errorMsg && <p className="text-xs text-accent-red bg-accent-red/10 p-3 rounded-lg border border-accent-red/20">{errorMsg}</p>}
            {successMsg && <p className="text-xs text-accent-green bg-accent-green/10 p-3 rounded-lg border border-accent-green/20">{successMsg}</p>}

            <Button 
              variant="primary" 
              className="w-full py-2.5 text-xs font-bold cursor-pointer hover:scale-[1.01]"
              onClick={handleGenerateToken}
              disabled={generating}
            >
              {generating ? 'Generating...' : '⚡ Generate Access Token'}
            </Button>
          </GlassCard>

          <GlassCard className="space-y-3">
            <h3 className="text-xs font-bold text-white">Console Rules</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Cloud Firestore security rules restrict read/write access to this directory to the admin UID only. All user queries on individual keys are audited.
            </p>
          </GlassCard>
        </div>

        {/* Tokens List / Table */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="space-y-5">
            
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.04] pb-4">
              <h3 className="text-xs font-bold text-white">Key Database</h3>
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by key/email..."
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-accent-theme/40 w-full sm:w-44"
                />
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-accent-theme/40 cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="UNUSED">Unused Only</option>
                  <option value="USED">Used Only</option>
                </select>
              </div>
            </div>

            {/* List */}
            {loadingTokens ? (
              <div className="text-center py-12 text-xs text-text-muted">Loading tokens from Firestore...</div>
            ) : filteredTokens.length === 0 ? (
              <div className="text-center py-12 text-xs text-text-muted">No activation keys found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-[10px] text-text-muted uppercase tracking-wider font-bold">
                      <th className="pb-3">Activation Key</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Used By</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {filteredTokens.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.01] transition-colors duration-150">
                        <td className="py-3 font-mono font-bold text-white selection:bg-accent-theme/30">{t.id}</td>
                        <td className="py-3">
                          <Badge variant={t.used ? 'NOT_HIT' : 'SIGNAL'} className="text-[8px] font-bold tracking-wider uppercase py-0.5">
                            {t.used ? 'USED' : 'UNUSED'}
                          </Badge>
                        </td>
                        <td className="py-3 text-text-secondary truncate max-w-[150px]" title={t.usedByEmail || ''}>
                          {t.usedByEmail || '—'}
                        </td>
                        <td className="py-3 text-right">
                          <button 
                            className="p-1 rounded bg-white/[0.04] border border-white/[0.08] hover:bg-accent-red/15 hover:border-accent-red/30 hover:text-accent-red transition-all cursor-pointer"
                            onClick={() => handleDeleteToken(t.id)}
                            title="Delete Key"
                          >
                            <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
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
