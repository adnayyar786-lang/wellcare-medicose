import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getFirebaseAuth, type FirebaseUserLike } from '@/lib/firebase-auth'

const CONVEX_URL =
  (import.meta as any).env.VITE_CONVEX_URL ||
  'https://impartial-reindeer-344.eu-west-1.convex.cloud'

const convex = new ConvexReactClient(CONVEX_URL)

export default function FirebaseConvexProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<FirebaseUserLike | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    try {
      const auth = getFirebaseAuth()
      if (!auth) {
        setIsLoading(false)
        return
      }
      unsubscribe = auth.onAuthStateChanged((next: FirebaseUserLike | null) => {
        setUser(next)
        setIsLoading(false)
      })
    } catch {
      setUser(null)
      setIsLoading(false)
    }
    return () => unsubscribe?.()
  }, [])

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!user) return null
      return await user.getIdToken(forceRefreshToken)
    },
    [user],
  )

  const useFirebaseAuth = useCallback(
    () => ({
      isLoading,
      isAuthenticated: !!user,
      fetchAccessToken,
    }),
    [isLoading, user, fetchAccessToken],
  )

  const authState = useMemo(
    () => ({ user, isLoading }),
    [user, isLoading],
  )

  return (
    <FirebaseAuthStateContext.Provider value={authState}>
      <ConvexProviderWithAuth client={convex} useAuth={useFirebaseAuth}>
        {children}
      </ConvexProviderWithAuth>
    </FirebaseAuthStateContext.Provider>
  )
}

import { createContext, useContext } from 'react'

type FirebaseAuthState = {
  user: FirebaseUserLike | null
  isLoading: boolean
}

const FirebaseAuthStateContext = createContext<FirebaseAuthState>({
  user: null,
  isLoading: true,
})

export function useFirebaseAuthState() {
  return useContext(FirebaseAuthStateContext)
}
