'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'

export function toMillis(ts: any): number | null {
  if (!ts) return null
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (typeof ts.seconds === 'number') return ts.seconds * 1000
  if (ts instanceof Date) return ts.getTime()
  if (typeof ts === 'number') return ts
  return null
}

export interface UserProfile {
  email: string
  displayName?: string
  approved: boolean
  role: 'user' | 'admin'
  tokenUsed?: string | null
  subscriptionPlan?: string | null
  subscriptionExpiresAt?: any
  rulesAccepted?: boolean
  createdAt?: any
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateDisplayName: (name: string) => Promise<void>
  claimInviteToken: (token: string) => Promise<void>
  acceptRules: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      
      if (currentUser) {
        // Force reset profile photoURL to the original Google Account avatar if it differs
        const googleInfo = currentUser.providerData.find((p) => p.providerId === 'google.com')
        const googlePhotoURL = googleInfo?.photoURL
        if (googlePhotoURL && currentUser.photoURL !== googlePhotoURL) {
          updateProfile(currentUser, { photoURL: googlePhotoURL })
            .then(() => {
              if (auth.currentUser) {
                setUser({ ...auth.currentUser } as User)
              }
            })
            .catch((err) => console.error('Failed to reset photo URL to Google default:', err))
        }

        const userDocRef = doc(db, 'users', currentUser.uid)
        
        // Setup bootstrap admin email
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
        const isAdminEmail = adminEmail && currentUser.email?.toLowerCase() === adminEmail.toLowerCase()

        // Real-time listener for user profile updates
        const unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile
            const expMs = toMillis(data.subscriptionExpiresAt)
            const isExpired = data.role !== 'admin' && data.approved && expMs !== null && Date.now() >= expMs

            if (isExpired) {
              setProfile({
                ...data,
                approved: false,
                tokenUsed: null,
                subscriptionPlan: null,
                subscriptionExpiresAt: null
              })
              setLoading(false)
              revokeExpiredAccess(currentUser.uid, data.tokenUsed).catch((err) =>
                console.error('Failed to revoke expired subscription:', err)
              )
              return
            }

            // Auto-promote to admin if email matches bootstrap
            if (isAdminEmail && (data.role !== 'admin' || !data.approved)) {
              await setDoc(userDocRef, {
                role: 'admin',
                approved: true
              }, { merge: true })
            } else {
              setProfile(data)
              setLoading(false)
            }
          } else {
            // First time login - create guest user profile
            const newProfile: UserProfile = {
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              approved: isAdminEmail ? true : false,
              role: isAdminEmail ? 'admin' : 'user',
              tokenUsed: null,
              createdAt: serverTimestamp()
            }
            await setDoc(userDocRef, newProfile)
            setProfile(newProfile)
            setLoading(false)
          }
        })

        return () => {
          unsubscribeProfile()
        }
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => unsubscribeAuth()
  }, [])

  const revokeExpiredAccess = async (uid: string, tokenUsed?: string | null) => {
    const userDocRef = doc(db, 'users', uid)
    const revokedFields = {
      approved: false,
      tokenUsed: null,
      subscriptionPlan: null,
      subscriptionExpiresAt: null
    }
    if (tokenUsed) {
      try {
        const batch = writeBatch(db)
        batch.delete(doc(db, 'invite_tokens', tokenUsed))
        batch.update(userDocRef, revokedFields)
        await batch.commit()
        return
      } catch {
        // Fallback if Firestore rules restrict invite_tokens delete to admin only
      }
    }
    await updateDoc(userDocRef, revokedFields)
  }

  // Enforce exact-time lockout while user is actively using the terminal
  useEffect(() => {
    if (!user || !profile || profile.role === 'admin' || !profile.approved) return
    const expMs = toMillis(profile.subscriptionExpiresAt)
    if (expMs === null) return

    const remainingMs = expMs - Date.now()
    if (remainingMs <= 0) {
      revokeExpiredAccess(user.uid, profile.tokenUsed).catch(console.error)
      return
    }

    // Cap timeout below 24h (32-bit signed int limit)
    const delayMs = Math.min(remainingMs, 24 * 60 * 60 * 1000)
    const timer = setTimeout(() => {
      if (Date.now() >= expMs) {
        revokeExpiredAccess(user.uid, profile.tokenUsed).catch(console.error)
      }
    }, delayMs)

    return () => clearTimeout(timer)
  }, [user, profile])

  const loginWithGoogle = async () => {
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Google Sign-in error:', err)
      setLoading(false)
      throw err
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Sign-out error:', err)
      setLoading(false)
    }
  }

  const updateDisplayName = async (name: string) => {
    if (!user) throw new Error('Not authenticated')
    const userDocRef = doc(db, 'users', user.uid)
    await updateDoc(userDocRef, {
      displayName: name
    })
  }

  const claimInviteToken = async (token: string) => {
    if (!user) throw new Error('Not authenticated')
    const cleanToken = token.trim().toUpperCase()
    if (!cleanToken) throw new Error('Token cannot be empty')

    const tokenDocRef = doc(db, 'invite_tokens', cleanToken)
    const userDocRef = doc(db, 'users', user.uid)

    const tokenSnap = await getDoc(tokenDocRef)
    if (!tokenSnap.exists()) {
      throw new Error('Access token does not exist. Please contact admin.')
    }

    const tokenData = tokenSnap.data()
    if (tokenData.used) {
      throw new Error('Access token has already been used.')
    }

    const isLifetime = tokenData.durationDays === null || tokenData.planLabel === 'Lifetime'
    const durationDays = isLifetime
      ? null
      : (typeof tokenData.durationDays === 'number' && tokenData.durationDays > 0 ? tokenData.durationDays : 30)
    const planLabel = isLifetime
      ? 'Lifetime'
      : (typeof tokenData.planLabel === 'string' && tokenData.planLabel ? tokenData.planLabel : `${durationDays} Days`)
    const expiresAt = durationDays !== null
      ? Timestamp.fromMillis(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null

    // Atomic update using a Batch
    const batch = writeBatch(db)
    
    // 1. Claim the token and start subscription countdown
    batch.update(tokenDocRef, {
      used: true,
      usedBy: user.uid,
      usedByEmail: user.email || 'N/A',
      usedAt: serverTimestamp(),
      expiresAt
    })

    // 2. Approve the user with subscription expiration
    batch.update(userDocRef, {
      approved: true,
      tokenUsed: cleanToken,
      subscriptionPlan: planLabel,
      subscriptionExpiresAt: expiresAt
    })

    await batch.commit()
  }


  const acceptRules = async () => {
    if (!user) throw new Error('Not authenticated')
    const userDocRef = doc(db, 'users', user.uid)
    await updateDoc(userDocRef, {
      rulesAccepted: true
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loginWithGoogle,
        logout,
        updateDisplayName,
        claimInviteToken,
        acceptRules
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
