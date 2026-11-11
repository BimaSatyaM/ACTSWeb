'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { UserAcademyProgress } from '@/types/academy'

const LOCAL_STORAGE_PREFIX = 'acts_academy_progress_'

const DEFAULT_PROGRESS: UserAcademyProgress = {
  completedLessonIds: [],
  quizScores: {},
  completedExerciseIds: [],
  lastVisitedLessonId: undefined,
  lastUpdated: new Date(0).toISOString(),
}

export function useAcademyProgress() {
  const { user } = useAuth()
  const uid = user?.uid || 'guest'
  const storageKey = `${LOCAL_STORAGE_PREFIX}${uid}`

  const [progress, setProgress] = useState<UserAcademyProgress>(() => {
    if (typeof window === 'undefined') return DEFAULT_PROGRESS
    try {
      const cached = localStorage.getItem(storageKey)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch {
      // Ignore localStorage errors
    }
    return DEFAULT_PROGRESS
  })

  const [loading, setLoading] = useState<boolean>(true)
  const isSyncingRef = useRef<boolean>(false)

  // 1. Initial Load from LocalStorage and Firestore Sync
  useEffect(() => {
    let isMounted = true

    // Load initial local copy for instant UI
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(storageKey)
        if (cached) {
          setProgress(JSON.parse(cached))
        }
      } catch (err) {
        console.warn('[useAcademyProgress] LocalStorage load failed:', err)
      }
    }

    if (!user) {
      setLoading(false)
      return
    }

    // Connect to Firestore real-time snapshot
    const userDocRef = doc(db, 'users', user.uid)
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (!isMounted) return

        if (docSnap.exists()) {
          const userData = docSnap.data()
          const remoteProgress = userData?.academyProgress as UserAcademyProgress | undefined

          if (remoteProgress) {
            setProgress((prevLocal) => {
              // Reconcile: Compare timestamps
              const remoteTime = new Date(remoteProgress.lastUpdated || 0).getTime()
              const localTime = new Date(prevLocal.lastUpdated || 0).getTime()

              if (remoteTime >= localTime) {
                // Remote is authoritative or newer
                try {
                  localStorage.setItem(storageKey, JSON.stringify(remoteProgress))
                } catch {
                  // ignore
                }
                return remoteProgress
              } else {
                // Local has offline updates newer than remote -> push to remote
                if (!isSyncingRef.current) {
                  isSyncingRef.current = true
                  setDoc(userDocRef, { academyProgress: prevLocal }, { merge: true })
                    .catch((err) => console.warn('[useAcademyProgress] Push local progress failed:', err))
                    .finally(() => {
                      isSyncingRef.current = false
                    })
                }
                return prevLocal
              }
            })
          }
        }
        setLoading(false)
      },
      (err) => {
        console.warn('[useAcademyProgress] Firestore listener error, running in offline mode:', err)
        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [user, storageKey])

  // Internal helper to persist state locally and remotely
  const saveProgress = useCallback(
    async (updater: (prev: UserAcademyProgress) => UserAcademyProgress) => {
      setProgress((prev) => {
        const updated = updater(prev)
        updated.lastUpdated = new Date().toISOString()

        // 1. Optimistic local storage update
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated))
          } catch (err) {
            console.warn('[useAcademyProgress] LocalStorage save failed:', err)
          }
        }

        // 2. Asynchronous Firestore sync
        if (user) {
          const userDocRef = doc(db, 'users', user.uid)
          setDoc(userDocRef, { academyProgress: updated }, { merge: true }).catch((err) => {
            console.warn('[useAcademyProgress] Firestore save failed, will reconcile next sync:', err)
          })
        }

        return updated
      })
    },
    [user, storageKey]
  )

  // Actions
  const markLessonComplete = useCallback(
    async (lessonId: string) => {
      await saveProgress((prev) => {
        if (prev.completedLessonIds.includes(lessonId)) return prev
        return {
          ...prev,
          completedLessonIds: [...prev.completedLessonIds, lessonId],
          lastVisitedLessonId: lessonId,
        }
      })
    },
    [saveProgress]
  )

  const recordQuizScore = useCallback(
    async (lessonId: string, score: number, total: number) => {
      const passed = total > 0 && score / total >= 0.7 // 70% passing grade
      await saveProgress((prev) => ({
        ...prev,
        quizScores: {
          ...prev.quizScores,
          [lessonId]: { score, total, passed },
        },
        // Auto-complete lesson if passed
        completedLessonIds:
          passed && !prev.completedLessonIds.includes(lessonId)
            ? [...prev.completedLessonIds, lessonId]
            : prev.completedLessonIds,
        lastVisitedLessonId: lessonId,
      }))
    },
    [saveProgress]
  )

  const markExerciseComplete = useCallback(
    async (exerciseId: string) => {
      await saveProgress((prev) => {
        if (prev.completedExerciseIds.includes(exerciseId)) return prev
        return {
          ...prev,
          completedExerciseIds: [...prev.completedExerciseIds, exerciseId],
        }
      })
    },
    [saveProgress]
  )

  const setLastVisitedLesson = useCallback(
    async (lessonId: string) => {
      await saveProgress((prev) => ({
        ...prev,
        lastVisitedLessonId: lessonId,
      }))
    },
    [saveProgress]
  )

  const resetProgress = useCallback(async () => {
    const blank: UserAcademyProgress = {
      completedLessonIds: [],
      quizScores: {},
      completedExerciseIds: [],
      lastVisitedLessonId: undefined,
      lastUpdated: new Date().toISOString(),
    }
    setProgress(blank)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey)
      } catch {
        // ignore
      }
    }
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid)
        await setDoc(userDocRef, { academyProgress: blank }, { merge: true })
      } catch (err) {
        console.warn('[useAcademyProgress] Reset failed in Firestore:', err)
      }
    }
  }, [user, storageKey])

  // Queries
  const isLessonCompleted = useCallback(
    (lessonId: string) => progress.completedLessonIds.includes(lessonId),
    [progress.completedLessonIds]
  )

  const isExerciseCompleted = useCallback(
    (exerciseId: string) => progress.completedExerciseIds.includes(exerciseId),
    [progress.completedExerciseIds]
  )

  const getQuizScore = useCallback(
    (lessonId: string) => progress.quizScores[lessonId],
    [progress.quizScores]
  )

  return {
    progress,
    loading,
    markLessonComplete,
    recordQuizScore,
    markExerciseComplete,
    setLastVisitedLesson,
    resetProgress,
    isLessonCompleted,
    isExerciseCompleted,
    getQuizScore,
  }
}
